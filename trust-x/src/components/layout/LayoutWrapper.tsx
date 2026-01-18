import Header from "./Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 bg-white dark:bg-gray-900 overflow-auto">{children}</main>
    </div>
  );
}
