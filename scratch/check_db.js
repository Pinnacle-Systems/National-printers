import { prisma } from '../src/lib/prisma.js';

async function main() {
  try {
    const modules = await prisma.approvalRuleModule.findMany();
    console.log('Modules:', modules);
    
    const configs = await prisma.approvalConfig.findMany({
      include: {
        Module: true
      }
    });
    console.log('Configs:', configs.map(c => ({ 
      id: c.id, 
      module: c.Module?.name, 
      active: c.active, 
      branchId: c.branchId 
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
