import { APIGatewayProxyHandler } from "aws-lambda";
import { uacsService } from "../../services/uacsService";

const { getAllUACS } = uacsService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const uacsList = await getAllUACS();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all UACS.",
        data: uacsList,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to fetch UACS",
        error: (error as Error).message,
      }),
    };
  }
};
