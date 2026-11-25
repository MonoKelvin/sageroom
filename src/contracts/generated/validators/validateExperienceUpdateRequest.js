import { t as require_ucs2length } from "./ucs2length.js";
// generated/raw-validators/validateExperienceUpdateRequest.js
var validateExperienceUpdateRequest = validate270;
var func2 = require_ucs2length().default;
function validate270(data, { instancePath = "", parentData, parentDataProperty, rootData = data, dynamicAnchors = {} } = {}) {
	let vErrors = null;
	const evaluated0 = validate270.evaluated;
	if (evaluated0.dynamicProps) evaluated0.props = void 0;
	if (evaluated0.dynamicItems) evaluated0.items = void 0;
	if (data && typeof data == "object" && !Array.isArray(data)) {
		let missing0;
		if (data.data_generation_id === void 0 && (missing0 = "data_generation_id") || data.agent_id === void 0 && (missing0 = "agent_id") || data.entry_id === void 0 && (missing0 = "entry_id") || data.content === void 0 && (missing0 = "content") || data.recorded_at === void 0 && (missing0 = "recorded_at") || data.score === void 0 && (missing0 = "score")) {
			validate270.errors = [{
				instancePath,
				schemaPath: "#/required",
				keyword: "required",
				params: { missingProperty: missing0 },
				message: "must have required property '" + missing0 + "'"
			}];
			return false;
		} else {
			for (const key0 in data) if (!(key0 === "agent_id" || key0 === "content" || key0 === "data_generation_id" || key0 === "entry_id" || key0 === "recorded_at" || key0 === "score")) {
				validate270.errors = [{
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
					validate270.errors = [{
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
				if (data.content !== void 0) {
					let data1 = data.content;
					if (typeof data1 === "string") {
						if (func2(data1) > 2e3) {
							validate270.errors = [{
								instancePath: instancePath + "/content",
								schemaPath: "#/properties/content/maxLength",
								keyword: "maxLength",
								params: { limit: 2e3 },
								message: "must NOT have more than 2000 characters"
							}];
							return false;
						} else if (func2(data1) < 1) {
							validate270.errors = [{
								instancePath: instancePath + "/content",
								schemaPath: "#/properties/content/minLength",
								keyword: "minLength",
								params: { limit: 1 },
								message: "must NOT have fewer than 1 characters"
							}];
							return false;
						}
					} else {
						validate270.errors = [{
							instancePath: instancePath + "/content",
							schemaPath: "#/properties/content/type",
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
							validate270.errors = [{
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
						if (data.entry_id !== void 0) {
							if (typeof data.entry_id !== "string") {
								validate270.errors = [{
									instancePath: instancePath + "/entry_id",
									schemaPath: "#/properties/entry_id/type",
									keyword: "type",
									params: { type: "string" },
									message: "must be string"
								}];
								return false;
							}
							var valid0 = true;
						} else var valid0 = true;
						if (valid0) {
							if (data.recorded_at !== void 0) {
								if (typeof data.recorded_at !== "string") {
									validate270.errors = [{
										instancePath: instancePath + "/recorded_at",
										schemaPath: "#/properties/recorded_at/type",
										keyword: "type",
										params: { type: "string" },
										message: "must be string"
									}];
									return false;
								}
								var valid0 = true;
							} else var valid0 = true;
							if (valid0) {
								if (data.score !== void 0) {
									let data5 = data.score;
									if (!(typeof data5 == "number" && !(data5 % 1) && !isNaN(data5) && isFinite(data5))) {
										validate270.errors = [{
											instancePath: instancePath + "/score",
											schemaPath: "#/properties/score/type",
											keyword: "type",
											params: { type: "integer" },
											message: "must be integer"
										}];
										return false;
									}
									if (typeof data5 == "number" && isFinite(data5)) {
										if (data5 > 100 || isNaN(data5)) {
											validate270.errors = [{
												instancePath: instancePath + "/score",
												schemaPath: "#/properties/score/maximum",
												keyword: "maximum",
												params: {
													comparison: "<=",
													limit: 100
												},
												message: "must be <= 100"
											}];
											return false;
										} else if (data5 < 0 || isNaN(data5)) {
											validate270.errors = [{
												instancePath: instancePath + "/score",
												schemaPath: "#/properties/score/minimum",
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
				}
			}
		}
	} else {
		validate270.errors = [{
			instancePath,
			schemaPath: "#/type",
			keyword: "type",
			params: { type: "object" },
			message: "must be object"
		}];
		return false;
	}
	validate270.errors = vErrors;
	return true;
}
validate270.evaluated = {
	"props": true,
	"dynamicProps": false,
	"dynamicItems": false
};
export { validateExperienceUpdateRequest };
