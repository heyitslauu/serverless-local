import { APIGatewayProxyHandler } from "aws-lambda";

import { allotmentService } from "../../services/allotmentService";

const { filterAllotments } = allotmentService();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const query = event.queryStringParameters || {};

    const filters = {
      status: query.status,
      from: query.from,
      to: query.to,
      papId: query.papId,
      allotmentId: query.allotmentId,
      particulars: query.particulars,
      search: query.search,
    };
    const response = await filterAllotments(filters);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully retrieved all allotments.",
        data: response.items,
        lastEvaluatedKey: response.lastEvaluatedKey,
        totalCount: response.totalCount,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to retrieve allotments.",
        error: error.message,
      }),
    };
  }
};
