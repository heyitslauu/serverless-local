import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { attachPAPToOffice } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;

    if (!officeId) {
      throw new Error("officeId is required in pathParameters.");
    }

    const body = JSON.parse(event.body);
    const newPAP = await attachPAPToOffice(officeId, body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Attached a PAP to an Office",
        PAP: newPAP,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error attaching PAP",
        error: error.message,
      }),
    };
  }
};
