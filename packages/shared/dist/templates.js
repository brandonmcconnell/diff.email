export function defaultHtmlTemplate(title = "Untitled Email") {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>${title}</title>
  </head>
  <body>
    <!-- start editing -->
  </body>
</html>`;
}
export const defaultJsxTemplate = `export default function Email() {
  return <p>Hello world!</p>;
}`;
