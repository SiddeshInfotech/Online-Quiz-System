import { motion } from "framer-motion";
import Container from "../../ui/Container";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Netflix",
  "Adobe",
  "IBM",
];

function TrustedCompanies() {
  return (
    <section className="py-16 bg-white">
      <Container>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-slate-400">
            Trusted by Students & Educators
          </p>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {companies.map((company) => (
              <div
                key={company}
                className="flex h-16 items-center justify-center rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-md"
              >
                <span className="font-semibold text-slate-500">
                  {company}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

export default TrustedCompanies;