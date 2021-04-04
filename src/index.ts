import {Command, flags} from '@oclif/command'
import axios from 'axios'
import {orderBy} from 'lodash'
const asciichart = require('asciichart')
const Table = require('cli-table3')

interface DataNode {
  date: Date;
  cumVaccinationFirstDoseUptakeByPublishDatePercentage: number;
  cumVaccinationSecondDoseUptakeByPublishDatePercentage: number;
}

class UkCovidStats extends Command {
  static flags = {
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    graph: flags.boolean({char: 'g', default: false}),
    'all-time': flags.boolean({char: 'a', default: false}),
  }

  async run() {
    const {flags} = this.parse(UkCovidStats)

    const rolloutUrl = 'https://coronavirus.data.gov.uk/api/v1/data?filters=areaName=United%2520Kingdom;areaType=overview&structure=%7B%22areaType%22:%22areaType%22,%22areaName%22:%22areaName%22,%22areaCode%22:%22areaCode%22,%22date%22:%22date%22,%22cumVaccinationFirstDoseUptakeByPublishDatePercentage%22:%22cumVaccinationFirstDoseUptakeByPublishDatePercentage%22,%22cumVaccinationSecondDoseUptakeByPublishDatePercentage%22:%22cumVaccinationSecondDoseUptakeByPublishDatePercentage%22%7D&format=json'
    const rolloutResponse = await axios.get(rolloutUrl)
    const rolloutData: DataNode[] = orderBy(rolloutResponse.data.data, ['date', 'asc'])
    let limitedRolloutData

    if (flags['all-time']) {
      limitedRolloutData = rolloutData
    } else {
      limitedRolloutData = rolloutData.slice(Math.max(rolloutData.length - 30, 1))
    }

    const rolloutTable = new Table({
      head: ['Date', 'First Dose %', 'Second Dose %'],
      colWidths: [15, 15, 16],
    })

    limitedRolloutData.forEach(row => {
      rolloutTable.push([row.date, row.cumVaccinationFirstDoseUptakeByPublishDatePercentage, row.cumVaccinationSecondDoseUptakeByPublishDatePercentage])
    })

    this.log('')
    this.log(rolloutTable.toString())

    if (flags.graph) {
      const firstDoseChart = new Array(limitedRolloutData.length)
      const secondDoseChart = new Array(limitedRolloutData.length)

      limitedRolloutData.forEach((row, index: number) => {
        firstDoseChart[index] = row.cumVaccinationFirstDoseUptakeByPublishDatePercentage
        secondDoseChart[index] = row.cumVaccinationSecondDoseUptakeByPublishDatePercentage
      })

      this.log('')
      this.log('Dose %')
      this.log('- 1st Dose: Blue')
      this.log('- 2nd Dose: Green')
      this.log('')

      const config = {
        colors: [
          asciichart.blue,
          asciichart.green,
        ],
      }

      this.log(asciichart.plot([firstDoseChart, secondDoseChart], config))
    }
  }
}

export = UkCovidStats
