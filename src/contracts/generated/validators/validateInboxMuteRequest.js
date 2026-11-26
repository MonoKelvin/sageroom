// generated/raw-validators/validateInboxMuteRequest.js
var validateInboxMuteRequest = validate438;
function validate438(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate438.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.client_request_id === void 0 && (missing0 = "client_request_id") || data.conversation_id === void 0 && (missing0 = "conversation_id") || data.muted === void 0 && (missing0 = "muted")) {
			validate438.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "client_request_id" || key0 === "conversation_id" || key0 === "data_generation_id" || key0 === "muted")) {
				validate438.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.client_request_id !== void 0) {
				if (typeof data.client_request_id !== "string") {
					validate438.errors = [{
						instancePath: instancePath + "/client_request_id",
						schemaPath: "#/properties/client_request_id/type",
						keyword: "type",
						params: { type: "string" },
						message: "must be string"
					}];
					return false;
				}
				var valid0 = true;
			} else var valid0 = true;
			if (valid0) {
				if (data.conversation_id !== void 0) {
					if (typeof data.conversation_id !== "string") {
						validate438.errors = [{
							instancePath: instancePath + "/conversation_id",
							schemaPath: "#/properties/conversation_id/type",
							keyword: "type",
							params: { type: "string" },
							message: "must be string"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.data_generation_id !== void 0) {
						if (typeof data.data_generation_id !== "string") {
							validate438.errors = [{
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
						if (data.muted !== void 0) {
							if (typeof data.muted !== "boolean") {
								validate438.errors = [{
									instancePath: instancePath + "/muted",
									schemaPath: "#/properties/muted/type",
									keyword: "type",
									params: { type: "boolean" },
									message: "must be boolean"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
					}
				}
			}
		}
	} else {
		validate438.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate438.errors = vErrors;
	return true;
}
validate438.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateInboxMuteRequest };
