import * as bcrypt from "bcryptjs";
import { prisma } from "../src/index";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "agencia-de-prueba" },
    update: {},
    create: {
      name: "Agencia de Prueba",
      slug: "agencia-de-prueba",
    },
  });

  const passwordHash = await bcrypt.hash("changeme123", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@agenciadeprueba.mx" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "owner@agenciadeprueba.mx",
      passwordHash,
      name: "Owner de Prueba",
      role: "OWNER",
    },
  });

  console.log("Seed listo:");
  console.log({ tenant: tenant.slug, ownerEmail: owner.email, password: "changeme123" });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
