const pathTool = require('path');
const { join: joinPath } = pathTool;

module.exports = buildAJavascriptBuildingPipelineForOneAppOrOnePage;

/*
*
*
*
*
*
*
* ****************************************
*           任务集工厂函数；工具
* ****************************************
*/

const buildAPipelineForBuildingOneAppOrOnePage = require('./_generic-pipeline-a-skeleton-for-building-and-then-copying');
const createTaskBodyForConcatenatingJavascriptFiles = require('../gulp-task-creators/js-simply-concat');

function buildAJavascriptBuildingPipelineForOneAppOrOnePage({
	// logging
	taskNameKeyPart,
	basePathForShorteningPathsInLog, // optional

	// sources
	sourceBasePath,
	buildingEntryGlobsRelativeToBasePath,
	watchingGlobs, // optional

	// building
	builtOutputBasePath,
	builtSingleFileBaseName,
	shouldNotGenerateMinifiedVersions = false,

	// copying
	shouldCopyBuiltFileToElsewhere = false,
	copyingFilesOutputBasePath, // optional
	copyingFilesTaskOption, // optional
}) {
	if (! buildingEntryGlobsRelativeToBasePath) {
		buildingEntryGlobsRelativeToBasePath = joinPath(sourceBasePath, '**/*.js');
	}

	if (! watchingGlobs) {
		watchingGlobs = joinPath(sourceBasePath, '**/*.js');
	}

	const builtGlobsRelativeToBuiltOutputBasePath = [
		`${builtSingleFileBaseName}.js`,
		`${builtSingleFileBaseName}.min.js`,
	];

	function toSimplyConcatJavascriptFiles({
		taskNameKeyPart,
		entryGlobsForBuilding,
		buildingOutputRootFolder,
		basePathForShorteningPathsInLog,
	}) {
		return createTaskBodyForConcatenatingJavascriptFiles(
			entryGlobsForBuilding,
			{
				taskNameForLogs: taskNameKeyPart,
				compiledJavascriptOutputFolder: buildingOutputRootFolder,
				compiledJavascriptFileBaseName: builtSingleFileBaseName,
				basePathForShorteningPathsInLog,
				shouldNotGenerateMinifiedVersions,
			}
		);
	}

	return buildAPipelineForBuildingOneAppOrOnePage({
		// logging
		pipelineCategory: 'Javascript',
		taskNameKeyPart,
		basePathForShorteningPathsInLog,

		// source
		sourceBasePath,
		buildingEntryGlobsRelativeToBasePath,
		watchingGlobs,

		// building
		builtOutputBasePath,
		builtGlobsRelativeToBuiltOutputBasePath,
		toCreateBuildingTaskBody: toSimplyConcatJavascriptFiles,

		// copying
		shouldCopyBuiltFileToElsewhere,
		copyingFilesOutputBasePath,
		copyingFilesTaskOption,
	});
}
