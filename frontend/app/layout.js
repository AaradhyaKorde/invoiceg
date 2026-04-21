import "./globals.css";

export const metadata = {
  title: "Invoice Generator",
  description: "Frontend for invoice generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Invoice Generator</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/items">Items</a>
              <a href="/invoices/new">New Invoice</a>
              <a href="/invoices">Invoice History</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
