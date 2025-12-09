import logo from '../../../assets/autopee-logo.png'

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <img
        alt="Autopee logo"
        className="h-9 w-9 rounded-xl bg-orange-500 p-1 shadow-sm"
        src={logo}
      />
      <span className="text-lg font-semibold tracking-tight text-orange-600">
        Autopee
      </span>
    </div>
  )
}

export default LogoMark

