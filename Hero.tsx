export default function Hero() {
  return (
    <section className="card p-6 lg:p-8 bg-gradient-to-r from-brand-50 via-white to-white shadow-lg shadow-brand-50/80">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">MindConnect</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Wellness + productivity for Africa’s next generation
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Track goals, manage tasks, book sessions with professionals, and keep your wellness in check—all in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <a className="btn" href="/tasks">Add Task</a>
          <a className="btn bg-white text-brand-700 border border-brand-200 hover:bg-brand-50" href="/book">Book Session</a>
        </div>
      </div>
    </section>
  );
}
