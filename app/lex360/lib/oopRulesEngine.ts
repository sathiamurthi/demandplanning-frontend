export interface RuleRow {
  id: string;          // QuestionNumber
  page: string;        // ManualPage
  description: string; // QuestionText
  typeCode: string;    // QuestionTypeCode
  fieldName: string;   // FieldName
  fieldType: string;   // FieldType
  order: number;       // RateOrder
  mode: string;        // RateMode
  parameters: string;  // RateParameters
  applyTo: string;     // RateApplyTo
  conditions: string;  // RateConditions
}

// Postfix condition evaluator for stack-based execution
export function evaluateConditionString(condStr: string, context: Record<string, any>): boolean {
  if (!condStr || condStr === "NULL" || condStr.trim() === "") return true;

  const parts = condStr.split(";").map(p => p.trim()).filter(p => p !== "");
  const stack: boolean[] = [];

  for (const part of parts) {
    const upperPart = part.toUpperCase();

    if (upperPart === "AND") {
      const b = stack.pop() ?? true;
      const a = stack.pop() ?? true;
      stack.push(a && b);
    } else if (upperPart === "OR") {
      const b = stack.pop() ?? false;
      const a = stack.pop() ?? false;
      stack.push(a || b);
    } else if (upperPart === "NOT") {
      const a = stack.pop() ?? false;
      stack.push(!a);
    } else {
      // Comparison: e.g. UWQuoteCode,=,A or !EffDate,>=,6/1/2011
      const compParts = part.split(",");
      if (compParts.length === 3) {
        const leftRef = compParts[0].trim();
        const op = compParts[1].trim();
        const rightRef = compParts[2].trim();

        // Resolve left value
        let leftVal = leftRef.startsWith("!") ? context[leftRef.slice(1)] : context[leftRef];
        if (leftVal === undefined) leftVal = "";

        // Resolve right value
        let rightVal: any = rightRef;
        if (rightRef.startsWith("&")) {
          rightVal = context[rightRef.slice(1)];
        } else if (rightRef.startsWith("'") && rightRef.endsWith("'")) {
          rightVal = rightRef.slice(1, -1);
        } else if (!isNaN(Number(rightRef))) {
          rightVal = Number(rightRef);
        }

        if (typeof leftVal === "number" && typeof rightVal === "string" && !isNaN(Number(rightVal))) {
          rightVal = Number(rightVal);
        }

        let res = false;
        if (op === "=" || op === "==") {
          res = String(leftVal) === String(rightVal) || leftVal === rightVal;
        } else if (op === "<>") {
          res = String(leftVal) !== String(rightVal) && leftVal !== rightVal;
        } else if (op === "<") {
          res = Number(leftVal) < Number(rightVal);
        } else if (op === ">") {
          res = Number(leftVal) > Number(rightVal);
        } else if (op === "<=") {
          res = Number(leftVal) <= Number(rightVal);
        } else if (op === ">=") {
          res = Number(leftVal) >= Number(rightVal);
        }
        
        stack.push(res);
      } else {
        // Fallback for single boolean flags
        const val = part.startsWith("!") ? context[part.slice(1)] : context[part];
        stack.push(!!val && val !== "N" && val !== "0" && val !== "FALSE");
      }
    }
  }

  return stack.pop() ?? true;
}

// Helper to resolve parameter values (variables or numeric constants)
function resolveValue(ref: string, context: Record<string, any>): any {
  if (!ref) return 0;
  const cleanRef = ref.trim();
  if (cleanRef.startsWith("!")) {
    return context[cleanRef.slice(1)] ?? 0;
  }
  if (!isNaN(Number(cleanRef))) {
    return Number(cleanRef);
  }
  return context[cleanRef] ?? 0;
}

// Abstract OOP base Component
export abstract class RuleComponent {
  public id: string;
  public description: string;
  public fieldName: string;
  public order: number;
  public mode: string;
  public parameters: string;
  public conditions: string;

  constructor(row: RuleRow) {
    this.id = row.id;
    this.description = row.description;
    this.fieldName = row.fieldName;
    this.order = row.order;
    this.mode = row.mode;
    this.parameters = row.parameters;
    this.conditions = row.conditions;
  }

  public isMet(context: Record<string, any>): boolean {
    return evaluateConditionString(this.conditions, context);
  }

  public abstract execute(context: Record<string, any>): string; // Returns execution log description
}

// OOP Implementation: MultiplyRule
export class MultiplyRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const params = this.parameters.split(",").map(p => p.trim()).filter(p => p !== "");
    let res = 1;
    params.forEach(p => {
      res *= Number(resolveValue(p, context)) || 0;
    });
    context[this.fieldName] = res;
    return `Multiplied [${params.join(" * ")}] to yield ${res}`;
  }
}

// OOP Implementation: AddRule
export class AddRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const params = this.parameters.split(",").map(p => p.trim()).filter(p => p !== "");
    let res = 0;
    params.forEach(p => {
      res += Number(resolveValue(p, context)) || 0;
    });
    context[this.fieldName] = res;
    return `Added [${params.join(" + ")}] to yield ${res}`;
  }
}

// OOP Implementation: SubtractRule
export class SubtractRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const params = this.parameters.split(",").map(p => p.trim());
    const left = Number(resolveValue(params[0], context)) || 0;
    const right = Number(resolveValue(params[1], context)) || 0;
    const res = left - right;
    context[this.fieldName] = res;
    return `Subtracted (${left} - ${right}) to yield ${res}`;
  }
}

// OOP Implementation: DivideRule
export class DivideRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const params = this.parameters.split(",").map(p => p.trim());
    const numerator = Number(resolveValue(params[0], context)) || 0;
    const denominator = Number(resolveValue(params[1], context)) || 1;
    const base = params[2] ? Number(resolveValue(params[2], context)) : 1;
    
    const division = denominator !== 0 ? numerator / denominator : 0;
    const res = division * base;
    context[this.fieldName] = res;
    return `Divided (${numerator} / ${denominator}) multiplied by base (${base}) to yield ${res}`;
  }
}

// OOP Implementation: AssignFieldRule
export class AssignFieldRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const val = resolveValue(this.parameters, context);
    context[this.fieldName] = val;
    return `Assigned parameter ${this.parameters} (value: ${val})`;
  }
}

// OOP Implementation: SetVariableRule
export class SetVariableRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    let val: any = this.parameters.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    } else if (!isNaN(Number(val))) {
      val = Number(val);
    }
    context[this.fieldName] = val;
    return `Set variable to static: ${val}`;
  }
}

// OOP Implementation: LookupVariableRule (Simulates database table lookups)
export class LookupVariableRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    // E.g., lookup for DwellingAgeGroup, ProtectionClass.
    // In actual system, this queries RateSupport tables.
    // Here we emulate realistic factors based on variables
    const params = this.parameters.split(",").map(p => p.trim());
    let factor = 1.0;

    if (this.fieldName === "TierFactor") {
      const tier = context["RatingTier"] || "1";
      factor = tier === "1" ? 0.90 : tier === "2" ? 1.00 : 1.15;
    } else if (this.fieldName === "AgeSurchargeFactor") {
      const ageGroup = Number(context["DwellingAgeGroup"]) || 0;
      factor = ageGroup === 0 ? 0.85 : ageGroup === 1 ? 1.00 : 1.25;
    } else if (this.fieldName === "OccupancyFactor") {
      const occ = context["Occupancy"] || "O";
      factor = occ === "O" ? 1.00 : 1.20;
    } else if (this.fieldName === "TaxRate") {
      factor = 0.04; // standard 4% tax lookup
    } else {
      factor = 1.05; // default rating factor
    }

    context[this.fieldName] = factor;
    return `Looked up variables [${params.join(", ")}] to resolve rating factor ${factor}`;
  }
}

// OOP Implementation: RateIfPositive (Specific base rate lookup logic)
export class RateIfPositiveRuleComponent extends RuleComponent {
  public execute(context: Record<string, any>): string {
    const params = this.parameters.split(",").map(p => p.trim());
    // E.g., TIV (Coverage A + B), PolicyForm, ProtectionClass
    const form = context["PolicyForm"] || "DP-1";
    const pc = Number(context["ProtectionClass"]) || 5;
    
    // Simulate realistic base insurance rates
    let baseRate = 350;
    if (form === "DP-3") baseRate = 480;
    if (pc > 6) baseRate += 120; // higher protection class means more hazard, higher rate
    
    context[this.fieldName] = baseRate;
    return `Calculated Base Rate from form ${form} and protection class ${pc} yields base premium $${baseRate}`;
  }
}

// Rules Parser and Runner Engine
export class OopRulesEngine {
  private components: RuleComponent[] = [];

  constructor(rows: RuleRow[]) {
    const sortedRows = [...rows].sort((a, b) => a.order - b.order);

    this.components = sortedRows.map(row => {
      const mode = (row.mode || "").toUpperCase();
      if (mode.startsWith("MULTIPLY")) {
        return new MultiplyRuleComponent(row);
      } else if (mode.startsWith("ADD")) {
        return new AddRuleComponent(row);
      } else if (mode.startsWith("SUBTRACT")) {
        return new SubtractRuleComponent(row);
      } else if (mode.startsWith("DIVIDE")) {
        return new DivideRuleComponent(row);
      } else if (mode.startsWith("ASSIGNFIELD")) {
        return new AssignFieldRuleComponent(row);
      } else if (mode.startsWith("SETVARIABLE")) {
        return new SetVariableRuleComponent(row);
      } else if (mode.startsWith("LOOKUPVARIABLE")) {
        return new LookupVariableRuleComponent(row);
      } else if (mode.startsWith("RATEIFPOSITIVE")) {
        return new RateIfPositiveRuleComponent(row);
      } else {
        // Fallback component
        return new SetVariableRuleComponent(row);
      }
    });
  }

  // Execute rules step-by-step
  public run(requestContext: Record<string, any>): {
    finalContext: Record<string, any>;
    trace: { order: number; id: string; desc: string; met: boolean; action: string }[];
  } {
    // Clone context
    const context = { 
      ...requestContext,
      PolicyYear: new Date().getFullYear(),
      EffDate: requestContext.EffectiveDate || "06/17/2019"
    };
    
    const trace: { order: number; id: string; desc: string; met: boolean; action: string }[] = [];

    this.components.forEach(comp => {
      const isMet = comp.isMet(context);
      let actionLog = "Condition not met, skipped";

      if (isMet) {
        actionLog = comp.execute(context);
      }

      trace.push({
        order: comp.order,
        id: comp.id,
        desc: comp.description,
        met: isMet,
        action: actionLog
      });
    });

    return {
      finalContext: context,
      trace
    };
  }

  public getComponents() {
    return this.components;
  }
}
