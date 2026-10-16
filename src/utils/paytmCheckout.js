
let loadedScriptUrl = "";
let loadingScriptPromise = null;
let activeCheckout = false;

const ALLOWED_HOSTS = [
  "securegw-stage.paytm.in",
  "securegw.paytm.in",
];

const loadPaytmScript = (host, mid) => {
  const scriptUrl =
    `https://${host}/merchantpgpui/checkoutjs/merchants/` +
    `${encodeURIComponent(mid)}.js`;

  if (
    loadedScriptUrl === scriptUrl &&
    window.Paytm?.CheckoutJS
  ) {
    return Promise.resolve();
  }

  if (
    loadingScriptPromise &&
    loadingScriptPromise.url === scriptUrl
  ) {
    return loadingScriptPromise.promise;
  }

  const promise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-paytm-checkout="true"]'
    );

    if (existingScript) {
      existingScript.remove();
    }

    // Avoid reusing an SDK from a different merchant.
    if (loadedScriptUrl !== scriptUrl) {
      window.Paytm = undefined;
    }

    const script = document.createElement("script");

    script.src = scriptUrl;
    script.async = true;
    script.dataset.paytmCheckout = "true";

    script.onload = () => {
      if (!window.Paytm?.CheckoutJS) {
        reject(new Error("Paytm CheckoutJS not available"));
        return;
      }

      loadedScriptUrl = scriptUrl;
      resolve();
    };

    script.onerror = () => {
      script.remove();
      reject(new Error("Unable to load Paytm checkout"));
    };

    document.body.appendChild(script);
  });

  loadingScriptPromise = {
    url: scriptUrl,
    promise,
  };

  promise.finally(() => {
    if (loadingScriptPromise?.promise === promise) {
      loadingScriptPromise = null;
    }
  }).catch(() => {});

  return promise;
};

export const openPaytmCheckout = async (payment) => {
  const {
    mid,
    orderId,
    txnToken,
    amount,
    host,
  } = payment || {};

  if (
    !mid ||
    !orderId ||
    !txnToken ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    throw new Error("Incomplete Paytm payment details");
  }

  if (!ALLOWED_HOSTS.includes(host)) {
    throw new Error("Invalid Paytm gateway host");
  }

  if (activeCheckout) {
    throw new Error("Paytm checkout is already open");
  }

  activeCheckout = true;

  try {
    await loadPaytmScript(host, mid);

    const checkout = window.Paytm?.CheckoutJS;

    if (!checkout) {
      throw new Error("Paytm CheckoutJS not available");
    }

    let settle;

    const checkoutResult = new Promise((resolve) => {
      let settled = false;

      settle = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
    });

    const config = {
      root: "",
      flow: "DEFAULT",
      data: {
        orderId: String(orderId),
        token: String(txnToken),
        tokenType: "TXN_TOKEN",
        amount: String(amount),
      },
      merchant: {
        redirect: false,
      },
      handler: {
        // notifyMerchant: (eventName) => {
        //   if (eventName === "APP_CLOSED") {
        //     settle({ closed: true });
        //   }
        // },
        notifyMerchant: (eventName) => {
  if (eventName === "APP_CLOSED") {
    settle({
      closed: true,
      attempted: false,
    });
  }
},
        transactionStatus: (result) => {
  settle({
    closed: false,
    attempted: true,
    result,
  });
},
        // transactionStatus: (result) => {
        //   settle({
        //     closed: false,
        //     result,
        //   });
        // },
      },
    };

    if (typeof checkout.onLoad === "function") {
      await Promise.race([
        new Promise((resolve, reject) => {
          try {
            checkout.onLoad(resolve);
          } catch (error) {
            reject(error);
          }
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(
              new Error("Paytm checkout loading timed out")
            );
          }, 15000);
        }),
      ]);
    }

    if (typeof checkout.init !== "function") {
      throw new Error("Paytm checkout init unavailable");
    }

    await checkout.init(config);

    if (typeof checkout.invoke !== "function") {
      throw new Error("Paytm checkout invoke unavailable");
    }

    await checkout.invoke();

    return await checkoutResult;
  } finally {
    activeCheckout = false;
  }
};

export const closePaytmCheckout = async () => {
  const checkout = window.Paytm?.CheckoutJS;

  if (!checkout || typeof checkout.close !== "function") {
    return false;
  }

  try {
    await Promise.race([
      Promise.resolve().then(() => checkout.close()),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Paytm close timed out"));
        }, 1500);
      }),
    ]);

    return true;
  } catch (error) {
    console.warn("Paytm checkout close:", error);
    return false;
  }
};



