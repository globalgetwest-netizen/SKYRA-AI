import {
  ProductionEngine,
} from "./workflows/production/production-engine.js";
import "dotenv/config";

import {
  AIProviderRouter,
} from "@skyra/ai/router";

import {
  DevelopmentAIProvider,
} from "@skyra/ai/development-provider";

import {
  AIDirector,
} from "./director/ai-director.js";

const router =
  new AIProviderRouter();

const developmentProvider =
  new DevelopmentAIProvider();

router.register(
  "local",
  developmentProvider
);

const director =
  new AIDirector(router);

const userRequest = `
Create a 30-second premium
cinematic advertisement for YUNEX.

YUNEX is a global economic and
commerce ecosystem connecting
African businesses with
international markets.

Show:

1. An African entrepreneur
   starting a business.

2. International trade.

3. Global commerce connecting
   Africa with the world.

4. A professional human presenter.

5. A powerful final call to action.

The video should be realistic,
premium, cinematic and futuristic.

Target audience:
African entrepreneurs and
global businesses.

Language:
English.

Create both 16:9 and 9:16 versions.
`;

console.log(
  "\n================================"
);

console.log(
  "       SKYRA AI DIRECTOR"
);

console.log(
  "================================\n"
);

try {
  const plan =
    await director.createPlan(
      userRequest
    );
const productionEngine =
  new ProductionEngine();

const productionResult =
  await productionEngine.execute(
    plan
  );

console.log(
  "\nSKYRA PRODUCTION RESULT\n"
);

console.log(
  JSON.stringify(
    productionResult,
    null,
    2
  )
);
  console.log(
    "\nSKYRA PRODUCTION PLAN\n"
  );

  console.log(
    JSON.stringify(
      plan,
      null,
      2
    )
  );

} catch (error) {
  console.error(
    "\nSKYRA AI ERROR:\n",
    error
  );

  process.exit(1);
}