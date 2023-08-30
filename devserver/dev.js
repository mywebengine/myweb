const http = require("http");
const fs = require('fs');

const hostname = "0.0.0.0";
const port = 3000;

const server = http.createServer((req, res) => {
	fs.readFile(`../src${req.url}`,(err, data) => {
		if (err) {
			res.statusCode = 404;
			res.setHeader("Content-Type", "text/plain");
			res.end(err);
			console.error(err);
			return;
		}
		res.statusCode = 200;
		res.setHeader("Content-Type", "text/javascript");
		res.end(data);
		console.log(data);
	});

	res.statusCode = 200;
	res.setHeader("Content-Type", "text/plain");
	res.end(req.uri);
	console.log(req.url, req.uri);
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
