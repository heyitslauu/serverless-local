import { APIGatewayProxyHandler } from "aws-lambda";

import { uacsService } from "../../services/uacsService";

const { attachUACSToPAP } = uacsService();

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

    const body = JSON.parse(event.body);

    const result = await attachUACSToPAP(officeId, papId, body);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Attached UACS to PAP",
        data: result,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error attaching UACS to PAP",
        error: error.message,
      }),
    };
  }
};
