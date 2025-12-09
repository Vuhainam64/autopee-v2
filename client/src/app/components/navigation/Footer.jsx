import LogoMark from '../branding/LogoMark.jsx'

const links = [
  { label: 'Tài liệu', href: '#' },
  { label: 'Hỗ trợ', href: '#contact' },
  { label: 'Chính sách bảo mật', href: '#' },
]

function Footer() {
  return (
    <footer className="border-t border-orange-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <LogoMark />
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {links.map((item) => (
            <a
              key={item.label}
              className="transition hover:text-orange-500"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Autopee. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer

