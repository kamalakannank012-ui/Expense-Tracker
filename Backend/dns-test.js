import dns from "node:dns/promises";

console.log("Default DNS servers:", dns.getServers());

try {
  const result = await dns.resolveSrv(
    "_mongodb._tcp.cluster0.dshezj9.mongodb.net"
  );
  console.log(result);
} catch (err) {
  console.error(err);
}