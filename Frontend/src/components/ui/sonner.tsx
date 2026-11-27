import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Below md the app has a bottom nav (and, on a first visit, the cookie
// banner), which bottom toasts covered. There, toasts show at the top instead.
const PHONE_QUERY = "(max-width: 767px)";

const useIsPhone = () => {
  const [isPhone, setIsPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(PHONE_QUERY).matches === true,
  );
  useEffect(() => {
    const query = window.matchMedia?.(PHONE_QUERY);
    if (!query) return;
    const update = () => setIsPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isPhone;
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isPhone = useIsPhone();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={isPhone ? "top-center" : "bottom-right"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
