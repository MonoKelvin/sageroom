// generated/raw-validators/validateExperienceAgentRequest.js
var validateExperienceAgentRequest = validate268;
function validate268(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate268.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.agent_id === void 0 && (missing0 = "agent_id")) {
			validate268.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "agent_id" || key0 === "data_generation_id")) {
				validate268.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.agent_id !== void 0) {
				if (typeof data.agent_id !== "string") {
					validate268.errors = [{
						instancePath: instancePath + "/agent_id",
						schemaPath: "#/properties/agent_id/type",
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
						validate268.errors = [{
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
			}
		}
	} else {
		validate268.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate268.errors = vErrors;
	return true;
}
validate268.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateExperienceAgentRequest };
