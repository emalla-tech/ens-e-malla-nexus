import { ProjectCard } from '../components/ProjectCard';
import { mockProjects } from '../data/mockData';

export function ProjectsPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Projects</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Project portfolio</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Track status, progress, task completion, ownership, and deadlines across executive initiatives.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>
    </div>
  );
}
