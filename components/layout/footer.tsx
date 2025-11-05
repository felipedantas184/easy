export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Easy Platform. Todos os direitos reservados.</p>
          <p className="mt-2">Solução completa para e-commerce</p>
        </div>
      </div>
    </footer>
  );
}