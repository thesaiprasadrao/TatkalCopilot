import https from "node:https";

export class TimeService {
  async sync() {
    const start = Date.now();
    const remoteTime = await this.fetchDateHeader("https://www.irctc.co.in");
    const end = Date.now();
    const latencyMs = end - start;
    const estimatedRemoteNow = remoteTime + latencyMs / 2;
    const driftMs = Math.round(estimatedRemoteNow - end);

    return {
      driftMs,
      latencyMs,
      syncedAt: new Date().toISOString(),
      message: `Clock sync complete. Drift ${driftMs}ms, latency ${latencyMs}ms.`
    };
  }

  fetchDateHeader(url) {
    return new Promise((resolve, reject) => {
      const request = https.request(url, { method: "HEAD", timeout: 8000 }, (response) => {
        const dateHeader = response.headers.date;
        response.resume();

        if (!dateHeader) {
          reject(new Error("No Date header returned."));
          return;
        }

        resolve(new Date(dateHeader).getTime());
      });

      request.on("timeout", () => {
        request.destroy(new Error("Clock sync timed out."));
      });
      request.on("error", reject);
      request.end();
    });
  }
}
