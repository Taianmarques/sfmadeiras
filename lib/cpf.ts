// Normalização e validação de CPF/CNPJ (aceita os dois formatos no mesmo campo)

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function validarCPF(cpf: string): boolean {
  const v = apenasDigitos(cpf);
  if (v.length !== 11 || /^(\d)\1{10}$/.test(v)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(v[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(v[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(v[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(v[10]);
}

export function validarCNPJ(cnpj: string): boolean {
  const v = apenasDigitos(cnpj);
  if (v.length !== 14 || /^(\d)\1{13}$/.test(v)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((acc, digito, i) => acc + parseInt(digito) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcularDigito(v.slice(0, 12), pesos1);
  if (d1 !== parseInt(v[12])) return false;

  const d2 = calcularDigito(v.slice(0, 13), pesos2);
  return d2 === parseInt(v[13]);
}

export function validarCpfCnpj(valor: string): boolean {
  const v = apenasDigitos(valor);
  if (v.length === 11) return validarCPF(v);
  if (v.length === 14) return validarCNPJ(v);
  return false;
}

export function formatarCpfCnpj(valor: string): string {
  const v = apenasDigitos(valor);
  if (v.length === 11) {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (v.length === 14) {
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return valor;
}
