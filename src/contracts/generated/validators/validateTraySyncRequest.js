// generated/raw-validators/validateTraySyncRequest.js
var validateTraySyncRequest = validate571;
function validate571(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate571.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.flashing === void 0 && (missing0 = "flashing") || data.conversation_count === void 0 && (missing0 = "conversation_count")) {
			validate571.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "conversation_count" || key0 === "data_generation_id" || key0 === "flashing")) {
				validate571.errors = [{
					instancePath,
					schemaPath: "#/additionalProperties",
					keyword: "additionalProperties",
					params: { additionalProperty: key0 },
					message: "must NOT have additional properties"
				}];
				return false;
			}
			if (data.conversation_count !== void 0) {
				let data0 = data.conversation_count;
				if (!(typeof data0 == "number" && !(data0 % 1) && !isNaN(data0) && isFinite(data0))) {
					validate571.errors = [{
						instancePath: instancePath + "/conversation_count",
						schemaPath: "#/properties/conversation_count/type",
						keyword: "type",
						params: { type: "integer" },
						message: "must be integer"
					}];
					return false;
				}
				if (typeof data0 == "number" && isFinite(data0)) {
					if (data0 < 0 || isNaN(data0)) {
						validate571.errors = [{
							instancePath: instancePath + "/conversation_count",
							schemaPath: "#/properties/conversation_count/minimum",
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
			if (valid0) {
				if (data.data_generation_id !== void 0) {
					if (typeof data.data_generation_id !== "string") {
						validate571.errors = [{
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
					if (data.flashing !== void 0) {
						if (typeof data.flashing !== "boolean") {
							validate571.errors = [{
								instancePath: instancePath + "/flashing",
								schemaPath: "#/properties/flashing/type",
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
	} else {
		validate571.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate571.errors = vErrors;
	return true;
}
validate571.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateTraySyncRequest };
