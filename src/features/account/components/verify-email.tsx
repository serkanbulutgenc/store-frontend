import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ApiError } from "@/lib/api/errors";
import { verifyEmail } from "../auth";
import { Notice } from "./auth-card";

/** One-shot: the link's key is spent by the first successful call, so never retry it. */
export function VerifyEmail({ verifyKey }: { verifyKey: string }) {
  const { isPending, error } = useQuery({
    queryKey: ["account", "verify-email", verifyKey],
    queryFn: async () => {
      await verifyEmail(verifyKey);
      return true;
    },
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  if (isPending) return <p aria-busy="true">E-postanız doğrulanıyor…</p>;
  if (error)
    return (
      <Notice title="Doğrulama bağlantısı geçersiz">
        {error instanceof ApiError && error.status === 400
          ? "Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir. Giriş yapmayı deneyin; hesabınız doğrulanmışsa giriş yapabilirsiniz."
          : "Doğrulama şu anda yapılamadı. Lütfen daha sonra tekrar deneyin."}{" "}
        <Link to="/hesap/giris" className="text-primary underline">
          Giriş yap
        </Link>
      </Notice>
    );
  return (
    <Notice title="E-postanız doğrulandı">
      <Link to="/hesap/giris" className="text-primary underline">
        Giriş yapın
      </Link>
    </Notice>
  );
}
