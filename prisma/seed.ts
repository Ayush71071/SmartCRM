import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo-account";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { name: "Demo User", email: DEMO_EMAIL, passwordHash },
  });

  let org = await db.organization.findFirst({ where: { slug: "acme-demo-co" } });
  if (!org) {
    org = await db.organization.create({
      data: { name: "Acme Demo Co", slug: "acme-demo-co", plan: "PRO" },
    });
  }

  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });

  // Idempotent re-seeds: wipe this org's business data before recreating it.
  await db.payment.deleteMany({ where: { organizationId: org.id } });
  await db.invoiceItem.deleteMany({ where: { invoice: { organizationId: org.id } } });
  await db.invoice.deleteMany({ where: { organizationId: org.id } });
  await db.dealProduct.deleteMany({ where: { deal: { organizationId: org.id } } });
  await db.product.deleteMany({ where: { organizationId: org.id } });
  await db.activity.deleteMany({ where: { organizationId: org.id } });
  await db.note.deleteMany({ where: { organizationId: org.id } });
  await db.meeting.deleteMany({ where: { organizationId: org.id } });
  await db.task.deleteMany({ where: { organizationId: org.id } });
  await db.deal.deleteMany({ where: { organizationId: org.id } });
  await db.lead.deleteMany({ where: { organizationId: org.id } });
  await db.customer.deleteMany({ where: { organizationId: org.id } });

  const customerData = [
    { name: "Priya Nair", email: "priya@brightwave.io", company: "Brightwave", industry: "SaaS", status: "ACTIVE" as const, tags: ["enterprise", "priority"] },
    { name: "Tom Becker", email: "tom@harbor-goods.com", company: "Harbor Goods", industry: "Retail", status: "ACTIVE" as const, tags: ["smb"] },
    { name: "Lena Fischer", email: "lena@nordlinemfg.com", company: "Nordline Manufacturing", industry: "Manufacturing", status: "LEAD" as const, tags: ["cold-outreach"] },
    { name: "Diego Alvarez", email: "diego@sunrisehealth.org", company: "Sunrise Health", industry: "Healthcare", status: "LEAD" as const, tags: ["referral"] },
    { name: "Amelia Chen", email: "amelia@fintechpulse.com", company: "FinTech Pulse", industry: "Finance", status: "ACTIVE" as const, tags: ["enterprise"] },
    { name: "Noah Patel", email: "noah@greenacre.co", company: "Greenacre Co", industry: "Agriculture", status: "INACTIVE" as const, tags: [] },
  ];

  const customers = [];
  for (const c of customerData) {
    customers.push(
      await db.customer.create({
        data: { ...c, phone: "+1 555 0100", organizationId: org.id, ownerId: user.id, createdById: user.id },
      })
    );
  }

  const leadStages = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
  for (let i = 0; i < customers.length; i++) {
    await db.lead.create({
      data: {
        organizationId: org.id,
        customerId: customers[i].id,
        stage: leadStages[i % leadStages.length],
        value: 5000 * (i + 2) * 100,
        probability: [10, 30, 50, 70, 85, 100, 0][i % leadStages.length],
        assignedToId: user.id,
        createdById: user.id,
        position: i,
        score: 40 + i * 8,
        scoreReason: "Seeded demo score based on company size and engagement recency.",
      },
    });
  }

  const product = await db.product.create({
    data: { organizationId: org.id, name: "SmartCRM Pro (annual)", price: 120000, sku: "SCRM-PRO-ANNUAL" },
  });

  const wonCustomer = customers[0];
  const deal = await db.deal.create({
    data: {
      organizationId: org.id,
      customerId: wonCustomer.id,
      title: "Brightwave — annual Pro plan",
      amount: 120000,
      status: "WON",
      closedAt: new Date(),
      createdById: user.id,
      products: { create: { productId: product.id, quantity: 1, unitPrice: 120000 } },
    },
  });

  const invoice = await db.invoice.create({
    data: {
      organizationId: org.id,
      customerId: wonCustomer.id,
      dealId: deal.id,
      invoiceNumber: "INV-1001",
      status: "PAID",
      dueDate: new Date(Date.now() + 14 * 86400000),
      subtotal: 120000,
      tax: 0,
      total: 120000,
      createdById: user.id,
      items: {
        create: { description: "SmartCRM Pro (annual)", quantity: 1, unitPrice: 120000, total: 120000, productId: product.id },
      },
    },
  });

  await db.payment.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice.id,
      amount: 120000,
      method: "CARD",
      status: "SUCCEEDED",
      paidAt: new Date(),
      reference: "seed_demo_payment",
    },
  });

  await db.task.createMany({
    data: [
      {
        organizationId: org.id,
        title: "Follow up with Harbor Goods on renewal",
        priority: "HIGH",
        dueDate: new Date(),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[1].id,
      },
      {
        organizationId: org.id,
        title: "Send proposal to Sunrise Health",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 86400000),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[3].id,
      },
    ],
  });

  await db.meeting.create({
    data: {
      organizationId: org.id,
      title: "Discovery call — FinTech Pulse",
      scheduledAt: new Date(Date.now() + 3 * 86400000),
      durationMinutes: 30,
      customerId: customers[4].id,
      createdById: user.id,
    },
  });

  console.log("Seeded demo organization 'Acme Demo Co'.");
  console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
