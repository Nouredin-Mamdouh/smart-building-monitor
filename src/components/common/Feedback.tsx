interface FeedbackProps {
  type: "success" | "error" | "info";
  message: string;
}

const styles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function Feedback({ type, message }: FeedbackProps) {
  return <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${styles[type]}`}>{message}</p>;
}
