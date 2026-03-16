import { categoryQuestionnaires } from "@/lib/category-questionnaires";

interface Props {
  category: string;
  answers: Record<string, string> | null | undefined;
}

const QuestionnaireAnswers = ({ category, answers }: Props) => {
  if (!answers || Object.keys(answers).length === 0) return null;

  const fields = categoryQuestionnaires[category] || [];
  
  // Build label map from field definitions
  const labelMap = new Map(fields.map(f => [f.id, f.label]));

  const entries = Object.entries(answers).filter(([_, v]) => v && String(v).trim());

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Category Details</h4>
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground shrink-0">{labelMap.get(key) || key}</span>
            <span className="text-right">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireAnswers;
