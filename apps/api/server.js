const http = require("http");

const port = Number(process.env.PORT || 4000);

const server = http.createServer((req, res) => {
  const path = (req.url || "/").split("?")[0];

  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "fresher-hub-api" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      name: "Fresher Hub API",
      status: "placeholder",
      message: "API scaffold is running and ready for Week 1 work.",
      routes: ["/health"],
    }),
  );
});

server.listen(port, () => {
  console.log(`Fresher Hub API listening on http://localhost:${port}`);
});
