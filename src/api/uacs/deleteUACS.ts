import { APIGatewayProxyHandler } from "aws-lambda";
import { uacsService } from "../../services/uacsService";

const { deleteUACS } = uacsService();

export const handler: APIGatewayProxyHandler = async (event) => {
  const uacsId = event.pathParameters?.uacsId;

  if (!uacsId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Missing uacsId in path parameters" }),
    };
  }

  try {
    await deleteUACS(uacsId);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "UACS deleted successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to delete UACS",
        error: (error as Error).message,
      }),
    };
  }
};
