// generated/raw-validators/validateExitReadyRequest.js
var validateExitReadyRequest = validate244;
function validate244(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate244.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.request_id === void 0 && (missing0 = "request_id") || data.ready === void 0 && (missing0 = "ready")) {
			validate244.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "data_generation_id" || key0 === "ready" || key0 === "request_id")) {
				validate244.errors = [{
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
					validate244.errors = [{
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
				if (data.ready !== void 0) {
					if (typeof data.ready !== "boolean") {
						validate244.errors = [{
							instancePath: instancePath + "/ready",
							schemaPath: "#/properties/ready/type",
							keyword: "type",
							params: { type: "boolean" },
							message: "must be boolean"
						}];
						return false;
					}
					var valid0 = true;
				} else var valid0 = true;
				if (valid0) {
					if (data.request_id !== void 0) {
						if (typeof data.request_id !== "string") {
							validate244.errors = [{
								instancePath: instancePath + "/request_id",
								schemaPath: "#/properties/request_id/type",
								keyword: "type",
								params: { type: "string" },
								message: "must be string"
							}];
							return false;
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate244.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate244.errors = vErrors;
	return true;
}
validate244.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateExitReadyRequest };
