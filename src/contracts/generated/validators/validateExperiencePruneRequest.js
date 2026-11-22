// generated/raw-validators/validateExperiencePruneRequest.js
var validateExperiencePruneRequest = validate254;
function validate254(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate254.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.agent_id === void 0 && (missing0 = "agent_id") || data.max_entries === void 0 && (missing0 = "max_entries")) {
			validate254.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "agent_id" || key0 === "data_generation_id" || key0 === "max_entries")) {
				validate254.errors = [{
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
					validate254.errors = [{
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
						validate254.errors = [{
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
					if (data.max_entries !== void 0) {
						let data2 = data.max_entries;
						if (!(typeof data2 == "number" && !(data2 % 1) && !isNaN(data2) && isFinite(data2))) {
							validate254.errors = [{
								instancePath: instancePath + "/max_entries",
								schemaPath: "#/properties/max_entries/type",
								keyword: "type",
								params: { type: "integer" },
								message: "must be integer"
							}];
							return false;
						}
						if (typeof data2 == "number" && isFinite(data2)) {
							if (data2 > 1e3 || isNaN(data2)) {
								validate254.errors = [{
									instancePath: instancePath + "/max_entries",
									schemaPath: "#/properties/max_entries/maximum",
									keyword: "maximum",
									params: {
										comparison: "<=",
										limit: 1e3
									},
									message: "must be <= 1000"
								}];
								return false;
							} else if (data2 < 0 || isNaN(data2)) {
								validate254.errors = [{
									instancePath: instancePath + "/max_entries",
									schemaPath: "#/properties/max_entries/minimum",
									keyword: "minimum",
									params: {
										comparison: ">=",
										limit: 0
									},
									message: "must be >= 0"
								}];
								return false;
							}
						}
						var valid0 = true;
					} else var valid0 = true;
				}
			}
		}
	} else {
		validate254.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate254.errors = vErrors;
	return true;
}
validate254.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateExperiencePruneRequest };
