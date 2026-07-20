import Container from "../../ui/Container";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h2 className="text-xl font-bold text-violet-600">QuizGen AI</h2>
            <p className="mt-2 text-sm text-slate-500">
              AI-powered quiz generation platform.
            </p>
          </div>

          <div className="flex gap-8 text-sm text-slate-600">
            <a href="#">About</a>
            <a href="#">Features</a>
          </div>

          <p className="text-sm text-slate-400">
            © 2026 QuizGen AI
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;