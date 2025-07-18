"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, location }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("تم التسجيل بنجاح! سيتم تحويلك لتسجيل الدخول...");
        setTimeout(() => router.push("/auth"), 1500);
      } else {
        setError(data.error || "فشل التسجيل");
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">تسجيل مستخدم جديد</h2>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {success && <div className="mb-2 text-green-600">{success}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="الاسم"
          className="mb-3 w-full p-2 border rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          className="mb-3 w-full p-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          className="mb-3 w-full p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="الموقع (Location)"
          className="mb-3 w-full p-2 border rounded"
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "جاري التسجيل..." : "تسجيل"}
        </button>
      </form>
      <div className="mt-4 text-center">
        لديك حساب؟ <a href="/auth" className="text-blue-600 underline">سجّل الدخول</a>
      </div>
    </div>
  );
}
