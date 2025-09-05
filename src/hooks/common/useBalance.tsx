import { useEffect, useState } from "react";

export const useBalance = (version: string, user: string) => {
  const [data, setData] = useState<number>(0); // State for data
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState(null); // State for error handling
  console.log("version", version);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const myHeaders = new Headers();
      myHeaders.append("Accept", "application/json");
      const requestOptions: any = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };
      let horizonUrl =
        version == "testnet"
          ? "https://horizon-testnet.stellar.org"
          : "https://horizon.stellar.org";
      fetch(`${horizonUrl}/accounts/${user}`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
          let dataResult = JSON.parse(result);
          console.log("data result", dataResult);
          setData(dataResult.balances[0].balance);
        })
        .catch((error) => {
          console.error("error", error);
          setError(error);
        });
      setLoading(false);
    };
    fetchData();
  }, [version, user]); // Dependency array with url
  return { data, loading, error };
};
