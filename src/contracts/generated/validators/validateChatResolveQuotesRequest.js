// generated/raw-validators/validateChatResolveQuotesRequest.js
var validateChatResolveQuotesRequest = validate164;
function validate164(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate164.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.message_ids === void 0 && (missing0 = "message_ids")) {
			validate164.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "message_ids")) {
				validate164.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.data_generation_id !== void 0) {
				if (typeof data.data_generation_id !== "string") {
					validate164.errors = [{
						instancePath: instancePath + "/data_generation_id",
						schemaPath: "#/properties/data_generation_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.message_ids !== void 0) {
					let data1 = data.message_ids;
					if (Array.isArray(data1)) {
						if (data1.length > 32) {
							validate164.errors = [{
								instancePath: instancePath + "/message_ids",
								schemaPath: "#/properties/message_ids/maxItems",
								keyword: "maxItems",
								params: { limit: 32 },
								message: "must NOT have more than 32 items"
							}];
							return false;
						} else {
							const len0 = data1.length;
							for (let i0 = 0; i0 < len0; i0++) if (typeof data1[i0] !== "string") {
								validate164.errors = [{
									instancePath: instancePath + "/message_ids/" + i0,
									schemaPath: "#/properties/message_ids/items/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
						}
					} else {
						validate164.errors = [{
							instancePath: instancePath + "/message_ids",
							schemaPath: "#/properties/message_ids/type",
							keyword: "type",
							params: { type: "array" },
							message: "must be array"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
			}
		}
	} else {
		validate164.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate164.errors = vErrors;
	return true;
}
validate164.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateChatResolveQuotesRequest };
