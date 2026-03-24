export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Blob backgrounds */}
      <div
        className="blob blob-accent"
        style={{
          width: 600,
          height: 600,
          top: -200,
          right: -200,
          position: "fixed",
        }}
      />
      <div
        className="blob blob-navy"
        style={{
          width: 400,
          height: 400,
          bottom: -100,
          left: -100,
          position: "fixed",
        }}
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
