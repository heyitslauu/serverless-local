import { APIGatewayProxyHandler } from "aws-lambda";
import { officeService } from "../../services/officeService";

const { patchOffice } = officeService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const officeId = event.pathParameters?.id;
    if (!officeId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Missing office id in path parameters",
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const data = JSON.parse(event.body);

    const updatedOffice = await patchOffice(officeId, data);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedOffice),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: (error as Error).message,
      }),
    };
  }
};
