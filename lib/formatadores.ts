export const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatPontos = (v: number) => v.toLocaleString("pt-BR");

export const formatData = (isoOuData: string | Date) => {
  const d = typeof isoOuData === "string" ? new Date(isoOuData) : isoOuData;
  return d.toLocaleDateString("pt-BR");
};

export const formatDataHora = (isoOuData: string | Date) => {
  const d = typeof isoOuData === "string" ? new Date(isoOuData) : isoOuData;
  return d.toLocaleString("pt-BR");
};
