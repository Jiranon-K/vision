import { Button } from "@/components/ui/button";

export interface AuthSubmitButtonProps {
  children: React.ReactNode;
  loading: boolean;
  "data-testid"?: string;
}

/** The one primary action an auth screen gets, sized to the design's 50px row. */
export function AuthSubmitButton({
  children,
  loading,
  "data-testid": testId,
}: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      fullWidth
      size="sm"
      className="mt-1.5 h-[50px] text-[15px]"
      loading={loading}
      loadingText="Working…"
      data-testid={testId}
    >
      {children}
    </Button>
  );
}
