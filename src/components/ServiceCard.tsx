type ServiceCardProps = {
  title: string
  desc: string
  delay?: string
}

export default function ServiceCard({ title, desc, delay = '0s' }: ServiceCardProps) {
  return (
    <div className="service-card" style={{ animationDelay: delay }}>
      <h3>{title}</h3>
      <p>{desc}</p>
      <div className="service-tags" />
      <div className="service-hover-line" />
    </div>
  )
}
