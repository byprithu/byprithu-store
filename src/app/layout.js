export const metadata = {
  title: 'byprithu — Poster Store',
  description: 'Order your favourite poster from @byprithu',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#fafafa', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
