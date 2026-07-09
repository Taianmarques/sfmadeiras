import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { registrarCompra, resgatarRecompensa } from "../lib/pontos";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: limpando dados existentes...");
  await prisma.logAuditoria.deleteMany();
  await prisma.movimentacaoPontos.deleteMany();
  await prisma.pontosLote.deleteMany();
  await prisma.resgate.deleteMany();
  await prisma.comprovante.deleteMany();
  await prisma.indicacao.deleteMany();
  await prisma.campanha.deleteMany();
  await prisma.recompensa.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.admin.deleteMany();

  console.log("Seed: criando admin...");
  await prisma.admin.create({
    data: {
      nome: "Administrador",
      email: "admin@sfmadeiras.com.br",
      senhaHash: await bcrypt.hash("admin123", 10),
    },
  });

  console.log("Seed: criando recompensas...");
  const recompensas = await Promise.all(
    [
      { nome: "Kit de pincéis para verniz", pontos: 150, estoque: 12, icone: "🖌️" },
      { nome: "Trena profissional 5m", pontos: 280, estoque: 8, icone: "📏" },
      { nome: "Furadeira de impacto", pontos: 1200, estoque: 3, icone: "🔧" },
      { nome: "Vale-desconto R$ 50", pontos: 500, estoque: 999, icone: "🎫" },
      { nome: "Jogo de brocas para madeira", pontos: 320, estoque: 15, icone: "🪚" },
      { nome: "Boné da loja", pontos: 90, estoque: 30, icone: "🧢" },
    ].map((r) => prisma.recompensa.create({ data: r }))
  );

  console.log("Seed: criando clientes...");
  const senhaClientePadrao = await bcrypt.hash("cliente123", 10);

  const carlos = await prisma.cliente.create({
    data: {
      nome: "Carlos Mendes",
      cpfCnpj: "12345678900",
      telefone: "5511999990001",
      senhaHash: senhaClientePadrao,
    },
  });
  const ana = await prisma.cliente.create({
    data: {
      nome: "Ana Beatriz Souza",
      cpfCnpj: "98765432100",
      telefone: "5511999990002",
      senhaHash: senhaClientePadrao,
    },
  });
  const joao = await prisma.cliente.create({
    data: {
      nome: "Marceneiro João Lima",
      cpfCnpj: "45678912300",
      telefone: "5511999990003",
      senhaHash: senhaClientePadrao,
    },
  });
  const construtora = await prisma.cliente.create({
    data: {
      nome: "Construtora Pinheiro",
      cpfCnpj: "11222333000144",
      telefone: "5511999990004",
      senhaHash: senhaClientePadrao,
    },
  });

  console.log("Seed: lançando histórico de compras...");
  await registrarCompra({ clienteId: carlos.id, valor: 340, descricao: "Compensado 15mm + parafusos" });
  await registrarCompra({ clienteId: carlos.id, valor: 580, descricao: "Tábuas de pinus tratado" });
  await registrarCompra({ clienteId: carlos.id, valor: 920, descricao: "Madeira de lei para móveis" });

  await registrarCompra({ clienteId: ana.id, valor: 215, descricao: "Cimento e areia" });
  await registrarCompra({ clienteId: ana.id, valor: 405, descricao: "Telhas e calhas" });

  for (const [valor, descricao] of [
    [850, "Vigas estruturais"],
    [620, "Assoalho de madeira"],
    [430, "Portas sob medida"],
    [1520, "Reforma de deck"],
  ] as const) {
    await registrarCompra({ clienteId: joao.id, valor, descricao });
  }

  for (const [valor, descricao] of [
    [3200, "Estrutura de telhado - Obra Jardim das Flores"],
    [2850, "Madeira tratada - Obra Vila Nova"],
    [1900, "Compensado naval - Obra Centro"],
    [1000, "Acabamentos diversos"],
  ] as const) {
    await registrarCompra({ clienteId: construtora.id, valor, descricao });
  }

  console.log("Seed: registrando um resgate de exemplo...");
  await resgatarRecompensa(carlos.id, recompensas.find((r) => r.nome === "Boné da loja")!.id);

  console.log("Seed: criando comprovante pendente de exemplo...");
  await prisma.comprovante.create({
    data: {
      clienteId: ana.id,
      valorInformado: 215,
      descricao: "Cimento e areia (comprovante anexado, sem CPF na nota)",
      arquivoNome: "nota-fiscal-0231.jpg",
      arquivoUrl: "/api/uploads/exemplo-seed.jpg",
      arquivoTipo: "IMAGEM",
    },
  });

  console.log("Seed: criando campanha de pontos em dobro de exemplo...");
  const inicioCampanha = new Date();
  const fimCampanha = new Date();
  fimCampanha.setDate(fimCampanha.getDate() + 7);
  await prisma.campanha.create({
    data: {
      nome: "Semana da Madeira em Dobro",
      multiplicador: 2,
      dataInicio: inicioCampanha,
      dataFim: fimCampanha,
    },
  });

  console.log("Seed concluído.");
  console.log("Login admin: admin@sfmadeiras.com.br / admin123");
  console.log("Login clientes: CPF/CNPJ acima / senha cliente123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
