const host = "issue8and9.org";
const key = "ab94791e46ad59935cdbce15e36b9e61";
const keyLocation = `https://${host}/${key}.txt`;
const urlList = [`https://${host}/`, `https://${host}/sources/`];

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

if (![200, 202].includes(response.status)) {
  const body = await response.text();
  throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
}

console.log(`IndexNow accepted ${urlList.length} updated URLs (${response.status}).`);
