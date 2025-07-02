import { APIGatewayProxyHandler } from "aws-lambda";

import { papService } from "../../services/papService";

const { getPAP } = papService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const allotmentId = event.pathParameters?.allotmentId;
    const papId = event.pathParameters?.papId;

    if (!allotmentId || !papId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing allotmentId or papId." }),
      };
    }

    const result = await getPAP(allotmentId, papId);

    if (!result) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "PAP not found." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "PAP retrieved", result }),
    };
  } catch (error: any) {
    console.error("Error fetching PAP:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
    };
  }
};
