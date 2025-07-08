import { APIGatewayProxyHandler } from "aws-lambda";

import { uacsService } from "../../services/uacsService";

const { listUACSForPAP } = uacsService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.officeId;
    const papId = event.pathParameters?.papId;

    if (!officeId) {
      throw new Error("officeId is required in pathParameters.");
    }

    if (!papId) {
      throw new Error("papId is required in pathParameters.");
    }

    const result = await listUACSForPAP(officeId, papId);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "UACS retrieved", data: result }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching UACS ",
        error: error.message,
      }),
    };
  }
};
