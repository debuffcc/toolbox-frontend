import React, { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

const GoogleAd: React.FC = () => {
  useEffect(() => {
    try {
      if (window.adsbygoogle && process.env.NODE_ENV === "production") {
        window.adsbygoogle.push({});
      }
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", width: 300, height: 600 }}
      data-ad-client="ca-pub-8973018250378604"
      data-ad-format="auto"
    />
  );
};

export default GoogleAd;
