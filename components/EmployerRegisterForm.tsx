"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registerEmployer } from "@/lib/interface"; // <-- updated function name

// Validation schema

import { registerUser } from "@/lib/auth";
import { getIndustries } from "@/lib/interface";
import { Industry } from "@/lib/types";
import { useEffect, useState } from "react";


const schema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  industry_id: z.string().min(1), // ✅ matches payload
});


type FormData = z.infer<typeof schema>;
export default function EmployerRegistration() {
    const [industries, setIndustries] = useState<Industry[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
      getIndustries()
        .then((res) => {
          if (res.success) setIndustries(res.data);
        })
        .catch(console.error);
    }, []);
    
  const onSubmit = async (data: FormData) => {
    const res = await registerEmployer(data); // <-- updated function call
    if (res.success) {
      alert("Employer registered successfully. Please login as employer admin.");
    } else {
      alert(res.message ?? "Employer registration failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 bg-[#161a23] p-8 rounded-xl"
    >
         <input {...register("firstName")} placeholder="First Name" className="input" />
              {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName.message}</p>}

          <input {...register("lastName")} placeholder="Last Name" className="input" />
      <input
        {...register("companyName")}
        placeholder="Company Name"
        className="w-full p-2 rounded"
      />
      {errors.companyName && (
        <p className="text-red-400">{errors.companyName.message}</p>
      )}
      
      <input
        {...register("email")}
        placeholder="Email"
        className="w-full p-2 rounded"
      />
      {errors.email && (
        <p className="text-red-400">{errors.email.message}</p>
      )}

      <select {...register("industry_id")} className="input">
                  <option value="">Select Industry</option>
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.industry_id}>
                      {ind.display_name}
                    </option>
                  ))}
                </select>
                
      <input
        {...register("password")}
        type="password"
        placeholder="Password"
        className="w-full p-2 rounded"
      />
      {errors.password && (
        <p className="text-red-400">{errors.password.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#6c63ff] py-2 rounded"
      >
        {isSubmitting ? "Registering..." : "Register Employer"}
      </button>
    </form>
  );
}
