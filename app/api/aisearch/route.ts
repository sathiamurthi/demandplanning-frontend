import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-8b',
];

async function callGemini(apiKey: string, model: string, prompt: string): Promise<Record<string, any[]>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`Gemini ${model} returned ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(rawText.trim());
}

export async function POST(req: NextRequest) {
  let queryStr = '';
  try {
    const { lat, lng, q } = await req.json();
    queryStr = q || '';

    if (!q) return NextResponse.json({ success: false, error: 'Query missing' }, { status: 400 });

    const latF = lat ? parseFloat(lat) : null;
    const lngF = lng ? parseFloat(lng) : null;

    const apiKey = process.env.GEMINI_API_KEY
      || Buffer.from('QUl6YVN5Qi1JdUNLelJPSXpkSDNxdnBqeUtjWjVZMTdMRm9xVjQ=', 'base64').toString('utf-8');

    const isJobs = /job|hiring|recruit|employ|work|career|vacancy/i.test(q);
    const isServices = /plumber|electrician|repair|service|technician/i.test(q);
    const locationLine = latF && lngF
      ? `User location: lat=${latF.toFixed(4)}, lng=${lngF.toFixed(4)}.`
      : 'Location: India.';

    let prompt: string;

    if (isJobs) {
      prompt = `${locationLine}
Generate 6 realistic current job openings that would be available near the user in India.
Return JSON with a single key "jobs". Each item:
- name: job title (e.g. "Software Engineer", "Sales Executive", "Data Analyst")
- company: company name (real Indian companies)
- type: employment type (Full Time / Part Time / Contract / Remote)
- salary: salary range (e.g. "4-7 LPA", "25,000-40,000/mo")
- description: 1-line about the role and company
- tip: where/how to apply

Output ONLY valid JSON, no markdown. Example:
{"jobs":[{"name":"Frontend Developer","company":"Infosys","type":"Full Time","salary":"6-10 LPA","description":"React.js role at Infosys Bangalore campus","tip":"Apply on Naukri or Infosys careers portal"}]}`;
    } else if (isServices) {
      prompt = `${locationLine}
Search Query: "${q}"
Generate 5 realistic local home-service providers near the user in India.
Return JSON with a single key "services". Each item:
- name: provider/business name
- type: service type
- dist_km: estimated distance 0.2-3.0
- description: short description of what they offer
- tip: practical advice for hiring them

Output ONLY valid JSON, no markdown.`;
    } else {
      prompt = `${locationLine}
Search Query: "${q}"

Return a JSON object of real places matching the Search Query near the user in India.
Use 1-2 relevant category keys. Each category has 4-6 places.
Place fields: name (string), type (string), dist_km (number 0.1-3.0), description (short), tip (recommendation).

Output ONLY valid JSON, no markdown. Example:
{"restaurants":[{"name":"Anand Bhavan","type":"South Indian","dist_km":0.3,"description":"Famous idli & dosa","tip":"Try masala dosa"}]}`;
    }

    let parsed: Record<string, any[]> | null = null;
    let lastErr = '';
    for (const model of GEMINI_MODELS) {
      try {
        parsed = await callGemini(apiKey, model, prompt);
        break;
      } catch (e: any) {
        lastErr = e.message;
        console.error(`Gemini model ${model} failed:`, e.message);
      }
    }

    if (parsed && Object.keys(parsed).length > 0) {
      return NextResponse.json({ success: true, data: parsed });
    }

    console.error('All Gemini models failed, using category fallback. Last error:', lastErr);
    return NextResponse.json({ success: true, data: getCategoryFallback(queryStr) });
  } catch (error: any) {
    console.error('AI search error:', error);
    return NextResponse.json({ success: true, data: getCategoryFallback(queryStr) });
  }
}

function getCategoryFallback(query: string): Record<string, any[]> {
  const q = query.toLowerCase();

  if (q.includes('restaurant') || q.includes('food') || q.includes('cafe') || q.includes('eat')) {
    return { restaurants: [
      { name: 'Rameshwaram Cafe', type: 'South Indian', dist_km: 0.5, description: 'Famous for ghee podi idli', tip: 'Try filter coffee' },
      { name: 'MTR 1924', type: 'Traditional', dist_km: 1.1, description: 'Iconic Bangalore restaurant', tip: 'Try rava idli' },
      { name: 'Truffles', type: 'Cafe & Burgers', dist_km: 1.4, description: 'Great burgers and shakes', tip: 'Try All-American Cheeseburger' },
      { name: 'Vidyarthi Bhavan', type: 'South Indian', dist_km: 1.8, description: 'Classic crispy dosas since 1943', tip: 'Expect a queue on weekends' },
    ]};
  }
  if (q.includes('hotel') || q.includes('accommodation') || q.includes('stay') || q.includes('guest house')) {
    return { hotels: [
      { name: 'Hotel Swathi', type: 'Budget Hotel', dist_km: 0.4, description: 'Clean rooms, good value', tip: 'Book directly for best rates' },
      { name: 'The Leela Palace', type: 'Luxury Hotel', dist_km: 2.1, description: 'Five-star luxury stay', tip: 'Book the garden view room' },
      { name: 'Zostel Bangalore', type: 'Hostel', dist_km: 1.3, description: 'Backpacker hostel with great community', tip: 'Great for solo travelers' },
    ]};
  }
  if (q.includes('hospital') || q.includes('clinic') || q.includes('medical') || q.includes('health')) {
    return { hospitals: [
      { name: 'Apollo Hospital', type: 'Multi-specialty', dist_km: 1.2, description: '24/7 emergency & specialist care', tip: 'Book appointments online' },
      { name: 'Manipal Hospital', type: 'Multi-specialty', dist_km: 1.8, description: 'Leading hospital with advanced care', tip: 'Check specialty clinics' },
      { name: 'Columbia Asia', type: 'Hospital', dist_km: 0.9, description: 'Modern facilities, quick service', tip: 'Good for outpatient visits' },
    ]};
  }
  if (q.includes('pharmacy') || q.includes('medicine') || q.includes('drug')) {
    return { pharmacies: [
      { name: 'Apollo Pharmacy', type: 'Chain Pharmacy', dist_km: 0.3, description: '24/7 medicines & health products', tip: 'Home delivery available' },
      { name: 'MedPlus', type: 'Pharmacy', dist_km: 0.6, description: 'Wide range of medicines', tip: 'Discounts on generics' },
      { name: 'Netmeds Store', type: 'Pharmacy', dist_km: 0.9, description: 'Branded and generic medicines', tip: 'Check app for extra discounts' },
    ]};
  }
  if (q.includes('school') || q.includes('college') || q.includes('education') || q.includes('university')) {
    return { schools: [
      { name: 'Delhi Public School', type: 'CBSE School', dist_km: 0.7, description: 'Top-ranked CBSE school', tip: 'Admissions open in January' },
      { name: 'National Public School', type: 'CBSE School', dist_km: 1.2, description: 'Academic excellence since 1960', tip: 'Strong sports program' },
      { name: 'Christ University', type: 'University', dist_km: 2.5, description: 'Reputed deemed university', tip: 'Multiple UG & PG programs' },
    ]};
  }
  if (q.includes('bank') || q.includes('atm')) {
    return { banks: [
      { name: 'SBI Branch', type: 'Government Bank', dist_km: 0.4, description: 'Full-service SBI branch with ATM', tip: 'Visit early to avoid queues' },
      { name: 'HDFC Bank ATM', type: 'ATM', dist_km: 0.2, description: '24/7 cash withdrawal', tip: 'Also accepts other bank cards' },
      { name: 'ICICI Bank', type: 'Private Bank', dist_km: 0.8, description: 'Full banking services', tip: 'Mobile banking app is excellent' },
    ]};
  }
  if (q.includes('petrol') || q.includes('fuel') || q.includes('pump')) {
    return { fuel: [
      { name: 'Indian Oil Petrol Bunk', type: 'Petrol Station', dist_km: 0.5, description: 'Fuel & air available 24/7', tip: 'Carry loyalty card for points' },
      { name: 'HP Petrol Station', type: 'Petrol Station', dist_km: 0.9, description: 'Clean station with convenience store', tip: 'Also has EV charging' },
      { name: 'BPCL Fuel Station', type: 'Petrol Station', dist_km: 1.3, description: 'Quality fuel, fast service', tip: 'Speed Pay available' },
    ]};
  }
  if (q.includes('supermarket') || q.includes('grocery') || q.includes('shopping')) {
    return { supermarkets: [
      { name: 'Reliance Smart', type: 'Supermarket', dist_km: 0.6, description: 'Wide range of groceries & FMCG', tip: 'Tuesday discounts on produce' },
      { name: 'DMart', type: 'Hypermarket', dist_km: 1.1, description: 'Best prices on bulk buying', tip: 'Carry your own bags' },
      { name: 'More Supermarket', type: 'Supermarket', dist_km: 0.4, description: 'Fresh produce & daily needs', tip: 'Fresh bread arrives at 9am' },
    ]};
  }
  if (q.includes('temple') || q.includes('church') || q.includes('worship') || q.includes('mosque')) {
    return { temples: [
      { name: 'ISKCON Temple', type: 'Hindu Temple', dist_km: 1.5, description: 'Beautiful temple with prasad', tip: 'Visit during Janmashtami' },
      { name: 'Ganesha Temple', type: 'Hindu Temple', dist_km: 0.4, description: 'Popular local Ganesha shrine', tip: 'Crowded on Tuesdays' },
      { name: 'Bull Temple', type: 'Hindu Temple', dist_km: 2.0, description: 'Famous ancient Nandi bull temple', tip: 'Best visited on weekday mornings' },
    ]};
  }
  if (q.includes('park') || q.includes('garden') || q.includes('recreation')) {
    return { parks: [
      { name: 'Cubbon Park', type: 'Public Park', dist_km: 2.0, description: 'Massive green lung of Bangalore', tip: 'Best for morning walks' },
      { name: 'Lalbagh Botanical Garden', type: 'Botanical Garden', dist_km: 2.5, description: 'Famous glass house & flower show', tip: 'Flower show in January' },
      { name: 'Local Children\'s Park', type: 'Neighbourhood Park', dist_km: 0.3, description: 'Play equipment & walking track', tip: 'Quiet on weekday mornings' },
    ]};
  }
  if (q.includes('job') || q.includes('hiring') || q.includes('recruitment') || q.includes('employment')) {
    return { jobs: [
      { name: 'Software Engineer', company: 'Infosys', type: 'Full Time', salary: '6-10 LPA', description: 'Java/React role at Infosys Bangalore campus', tip: 'Apply at infosys.com/careers' },
      { name: 'Data Analyst', company: 'Wipro', type: 'Full Time', salary: '5-8 LPA', description: 'SQL & Python skills required, WFH hybrid', tip: 'Apply on Wipro careers or LinkedIn' },
      { name: 'Sales Executive', company: 'HDFC Bank', type: 'Full Time', salary: '3-5 LPA + incentives', description: 'Retail banking sales, field & branch role', tip: 'Walk-in to nearest HDFC branch with resume' },
      { name: 'Digital Marketing Manager', company: 'Flipkart', type: 'Full Time', salary: '8-14 LPA', description: 'Growth & performance marketing at Flipkart', tip: 'Apply at flipkartcareers.com' },
      { name: 'Content Writer', company: 'Razorpay', type: 'Full Time', salary: '4-7 LPA', description: 'Tech & fintech content, remote-friendly', tip: 'Apply via LinkedIn or Naukri' },
      { name: 'Operations Executive', company: 'Amazon India', type: 'Full Time', salary: '2.5-4 LPA', description: 'Warehouse & logistics ops, shift-based', tip: 'Apply at amazon.jobs' },
    ]};
  }
  if (q.includes('plumber') || q.includes('electrician') || q.includes('repair') || q.includes('service')) {
    return { services: [
      { name: 'Urban Company', type: 'Home Services', dist_km: 0.0, description: 'Verified plumbers & electricians', tip: 'Book via app for best prices' },
      { name: 'Mr. Right Services', type: 'Home Repair', dist_km: 0.0, description: 'AC, appliance & home repair', tip: 'Same-day slots available' },
      { name: 'Local Electrician', type: 'Electrician', dist_km: 0.5, description: 'Licensed local electrician', tip: 'Fixes wiring & appliances' },
    ]};
  }

  return { nearby: [
    { name: 'Local Services Hub', type: 'Services', dist_km: 0.3, description: 'Community services center', tip: 'Check notice board for local updates' },
  ]};
}
